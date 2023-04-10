import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import { RcFile } from "antd/lib/upload";
import XLSX from 'xlsx'

export async function translate(content: string, targetLang: string, extraPrompt?: string) {
    const res = await fetch("/api/fastTranslate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
            targetLang: targetLang,
            extraPrompt
        }),
    })
    const data = await res.json();
    if (data.success) {
        return data.data
    } else {
        throw new Error(data.message)
    }
}

export async function exportLocalFiles(content: string, langList: string[]) {
    const res = await fetch("/api/exportLocalFiles", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
            langList
        }),
    })
    const data = await res.json();
    if (data.success) {
        return data.data
    } else {
        throw new Error(data.message)
    }
}

export async function makeLocalesInZip (data: { lang: string, content: string }[]): Promise<File> {
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    for (let item of data) {
        const content = new TextReader(item.content);
        await zipWriter.add(`${item.lang}.json`, content);
    }
    const blob = await zipWriter.close();
    return new File([blob], 'locales.json');
}

export function downloadFileFromBlob(content: Blob, fileName: string) {
    const ele = document.createElement('a');
    ele.setAttribute('href', URL.createObjectURL(content));
    ele.setAttribute('download', fileName);
    ele.style.display = 'none';
    document.body.appendChild(ele);
    ele.click();

    document.body.removeChild(ele);
}

export function uploadExcelFile(file:RcFile,FileList:RcFile[]){
    let resData = [{}];// 存储获取到的数据
    // 通过FileReader对象读取文件
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = event => {
        try {
            const result = event.target?.result;
            // 以二进制流方式读取得到整份excel表格对象
            const workbook = XLSX.read(result, { type: 'binary' });
            // 遍历每张工作表进行读取（这里默认只读取第一张表）
            for (const sheet in workbook.Sheets) {
                if (workbook.Sheets.hasOwnProperty(sheet)) {
                    // 利用 sheet_to_json 方法将 excel 转成 json 数据
                    resData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
                    break; // 如果只取第一张表，就取消注释这行
                }
            }
            //将读取到的数据传入后台

            console.log(resData)
        } catch (e) {
            // 这里可以抛出文件类型错误不正确的相关提示
            console.log('文件类型不正确',e);
        }

    };
    return false
}
