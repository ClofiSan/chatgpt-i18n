import React, { useCallback, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import Header from "../../components/header";
import Background from "../../components/background";
import DropdownSelect from "../../components/dropdownSelect";
import { compressJson, copy2Clipboard, prettierJson } from "./utils";
import ExportFiles from "./exportFiles";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { intlLanguages } from "./config";
import { translate } from "./services";
import Spinner from "../../components/spinner";
import { useNotification } from "../../notify";
import TextField from "../../components/textField";
import { Button, Form, message, Upload } from "antd";
import { RcFile } from "antd/lib/upload";
import * as XLSX from "xlsx";

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === "json") {
            return new jsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
            return new cssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return new htmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

loader.config({ monaco });
loader.init();

const Translate: React.FC = (props) => {
    const [originalContent, setOriginalContent] = useState("");
    const [lang, setLang] = useState<string>(intlLanguages[1].value);
    const [transContent, setTransContent] = useState("");
    const [extraPrompt, setExtraPrompt] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const { notify } = useNotification();

    const requestTranslation = useCallback(async () => {
        setLoading(true);
        try {
            const compressedContent = compressJson(originalContent);
            const data = await translate(compressedContent, lang, extraPrompt);
            setTransContent(prettierJson(data));
        } catch (error) {
            notify({
                title: "translate service error",
                message: `${error}`,
                type: "error"
            }, 3000);
        } finally {
            setLoading(false);
        }
    }, [originalContent, lang, extraPrompt]);


    function uploadExcelFile(file: RcFile, FileList: RcFile[]) {
        let resData = [{}];// 存储获取到的数据
        // 通过FileReader对象读取文件
        const fileReader = new FileReader();
        fileReader.readAsBinaryString(file);
        fileReader.onload = async event => {
            try {
                const result = event.target?.result;
                // // 以二进制流方式读取得到整份excel表格对象
                const workbook = XLSX.read(result, { type: "binary" });
                // // 遍历每张工作表进行读取（这里默认只读取第一张表）
                for (const sheet in workbook.Sheets) {
                    if (workbook.Sheets.hasOwnProperty(sheet)) {
                        // 利用 sheet_to_json 方法将 excel 转成 json 数据
                        resData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
                        break; // 如果只取第一张表，就取消注释这行
                    }
                }
                //将读取到的数据传入后台
                console.log(resData);
                let jsonData = JSON.stringify(resData);
                console.log(jsonData);
                // console.log(process.env.OPENAI_API_KEY);
                setOriginalContent(jsonData)
                setLoading(true);
                try {
                    const compressedContent = compressJson(jsonData);
                    const data = await translate(compressedContent, lang, extraPrompt);
                    setTransContent(prettierJson(data));
                } catch (error) {
                    notify({
                        title: "translate service error",
                        message: `${error}`,
                        type: "error"
                    }, 3000);
                } finally {
                    setLoading(false);
                }

            } catch (e) {
                // 这里可以抛出文件类型错误不正确的相关提示
                console.log("文件类型不正确", e);
            }

        };
        return false;
    }


    return (
        <div className="text-white">
            <Header />
            <Background />
            <div className="container mx-auto mt-4">
                <div className="dark flex items-center">
                    <DropdownSelect
                        className="inline-block w-36"
                        buttonClassName="w-full"
                        options={intlLanguages}
                        selectedKey={lang}
                        onSelect={(val) => {
                            setLang(val);
                        }}
                    />
                    <button
                        type="button"
                        className="ml-2 px-6 inline-flex rounded bg-indigo-600 shadow-indigo-500/50 py-1.5 px-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        onClick={requestTranslation}
                    >
                        {loading && <Spinner />}
                        Translate
                    </button>
                    <ExportFiles originalContent={originalContent} />
                </div>
                <div className="mt-2">
                    <TextField
                        label="Customized Prompt (Optional)"
                        placeholder="Add more prompt (like background knowledge) to help the translation if needed."
                        value={extraPrompt}
                        onChange={(val) => {
                            setExtraPrompt(val);
                        }}
                    />
                </div>
                <div className="grid grid-cols-2 mt-6">
                    <div className="shadow-lg border border-gray-700 rounded m-2">
                        <div className="p-2">Original locale</div>
                        <MonacoEditor
                            value={originalContent}
                            onChange={(val) => {
                                setOriginalContent(val ?? "");
                            }}
                            height="600px"
                            language="json"
                            theme="vs-dark"
                        />
                    </div>
                    <div className="shadow-lg border border-gray-700 rounded m-2">
                        <div className="p-2">
                            Translated locale
                            <DocumentDuplicateIcon
                                onClick={() => {
                                    copy2Clipboard(transContent);
                                    notify({
                                        type: "success",
                                        title: "copied!",
                                        message: "copy to clipboard"
                                    }, 1000);
                                }}
                                className="float-right w-5 text-white cursor-pointer hover:scale-110"
                            />
                        </div>
                        <MonacoEditor
                            // onMount={(editor, m) => {
                            //     resultEditorRef.current = editor;
                            // }}
                            value={transContent}
                            height="600px"
                            language="json"
                            theme="vs-dark"
                        />
                    </div>
                </div>
            </div>
            <div className="App">
                <Form.Item label="文件路径" className="upload-form">
                    <Upload beforeUpload={uploadExcelFile} onRemove={() => {
                    }}>
                        <Button type="link">
                            选择文件
                        </Button>
                    </Upload>
                </Form.Item>
            </div>
        </div>
    );
};

export default Translate;
