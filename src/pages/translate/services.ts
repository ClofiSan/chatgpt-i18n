import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import { RcFile } from "antd/lib/upload";
import * as XLSX from 'xlsx'
import { intlLanguages } from "./config";
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

