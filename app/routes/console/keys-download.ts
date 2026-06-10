import admin from "firebase-admin";
import type { LoaderFunctionArgs } from "react-router";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { requireAdmin } from "~/auth/session.server";

// 簡易シートコピー関数
function copySheet(srcSheet: ExcelJS.Worksheet, destSheet: ExcelJS.Worksheet) {
  // 列幅をコピー
  srcSheet.columns.forEach((col, i) => {
    if (col && typeof i === "number") {
      destSheet.getColumn(i + 1).width = col.width;
    }
  });

  // 各行・セルをコピー
  srcSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const destRow = destSheet.getRow(rowNumber);
    destRow.height = row.height;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const destCell = destRow.getCell(colNumber);
      destCell.value = cell.value;
      destCell.style = { ...cell.style }; // スタイルをコピー
    });
  });

  // ページセットアップをコピー（A4サイズ、マージン設定などを引き継ぐため）
  if (srcSheet.pageSetup) {
    destSheet.pageSetup = { ...srcSheet.pageSetup };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // 認証ガード: 管理者のみアクセス可能
  await requireAdmin(request);

  const url = new URL(request.url);
  const codesParam = url.searchParams.get("codes");
  const gameId = url.searchParams.get("gameId");

  let codes: string[] = [];
  const db = admin.firestore();

  if (codesParam) {
    codes = codesParam.split(",").map(c => c.trim()).filter(Boolean);
  } else if (gameId) {
    const querySnapshot = await db.collection("serialCodes").where("game", "==", gameId).get();
    codes = querySnapshot.docs.map(doc => doc.data().serialCode);
  }

  if (codes.length === 0) {
    return new Response("シリアルコードが見つかりません。", { status: 400 });
  }

  const templatePath = path.join(process.cwd(), "serialcode-a4-template.xlsx");
  if (!fs.existsSync(templatePath)) {
    return new Response("Excelテンプレートファイルが見つかりません。", { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const templateSheet = workbook.getWorksheet(1);
  if (!templateSheet) {
    return new Response("テンプレートワークシートが見つかりません。", { status: 500 });
  }

  // 1ページあたり 86 件 (2列 × 43行)。
  // A1~A43, B1~B43。
  // 書き込みセルは: A1, B1, A2, B2, ..., A43, B43
  const cellPositions: string[] = [];
  for (let row = 1; row <= 43; row++) {
    cellPositions.push(`A${row}`);
    cellPositions.push(`B${row}`);
  }

  const codesPerSheet = cellPositions.length; // 86
  const numSheets = Math.ceil(codes.length / codesPerSheet);

  // 必要な枚数のワークシートを準備し、スタイルを複製する
  const sheets: ExcelJS.Worksheet[] = [templateSheet];
  for (let s = 1; s < numSheets; s++) {
    const newSheet = workbook.addWorksheet(`ページ ${s + 1}`);
    copySheet(templateSheet, newSheet);
    sheets.push(newSheet);
  }

  // シリアルコードの書き込み
  for (let i = 0; i < codes.length; i++) {
    const sheetIndex = Math.floor(i / codesPerSheet);
    const codeIndex = i % codesPerSheet;
    const sheet = sheets[sheetIndex];
    const cellRef = cellPositions[codeIndex];

    const cell = sheet.getCell(cellRef);
    cell.value = codes[i];
  }

  // 最後のシートの余った枠（テンプレートのプレースホルダー）をクリアする
  const lastSheetUsedCodes = codes.length % codesPerSheet;
  if (lastSheetUsedCodes !== 0) {
    const lastSheet = sheets[sheets.length - 1];
    for (let j = lastSheetUsedCodes; j < codesPerSheet; j++) {
      const cellRef = cellPositions[j];
      const cell = lastSheet.getCell(cellRef);
      cell.value = "";
    }
  }

  // Excelファイルのバッファ作成
  const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

  const sanitizedGameId = gameId ? gameId.replace(/[^a-zA-Z0-9_-]/g, "") : "serial";
  const filename = `${sanitizedGameId}-codes.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
