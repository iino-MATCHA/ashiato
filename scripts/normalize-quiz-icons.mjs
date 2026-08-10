/**
 * 診断の選択肢アイコンを、そのまま使える形に整える。
 *
 *   node scripts/normalize-quiz-icons.mjs [入力フォルダ]
 *   （既定の入力は public/quiz-icons/raw、出力は public/quiz-icons）
 *
 * 画像生成AIから上がってくるものは 1024x1024 で、絵の周りに大きな余白が
 * 付いていることが多い。**その余白がそのまま縮小されると、28pxの枠の中で
 * 絵が13px程度になって潰れる。** ここでやるのは3つだけ:
 *
 *   1. 余白を落とす（白と透明のどちらでも）
 *   2. 正方形に整え、版面の 8% を余白として残す（絵が 84% を占める）
 *   3. 96x96 のPNGに縮める（28px表示・3倍端末で84px相当に足りる）
 *
 * SVGが来たときは触らない ―― ベクタは縮小で滲まないので、そのまま置く。
 */
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const IN = process.argv[2] ?? 'public/quiz-icons/raw';
const OUT = 'public/quiz-icons';
/** 出す大きさ。表示は28pxで、3倍端末でも足りる */
const SIZE = 96;
/** 版面に残す余白の割合（片側）。絵は 84% を占める */
const MARGIN = 0.08;

/**
 * 余白の切り落とし。
 * 透明ならアルファで、白地なら白で落とす。生成AIは背景を透明にし忘れる
 * ことが多いので、両方に備える（threshold は影の薄い縁も余白と見なす幅）。
 */
async function trimmed(file) {
  const img = sharp(file);
  const { hasAlpha } = await img.metadata();
  // 透明背景ならアルファ基準、そうでなければ左上の色（＝白地）基準で落とす
  return sharp(file).trim({ background: hasAlpha ? { r: 0, g: 0, b: 0, alpha: 0 } : '#ffffff', threshold: 12 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let files;
  try {
    files = await readdir(IN);
  } catch {
    console.error(`入力フォルダがありません: ${IN}`);
    console.error('生成した画像をそこに置いてから、もう一度実行してください。');
    process.exit(1);
  }

  const targets = files.filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f));
  if (!targets.length) {
    console.error(`${IN} に画像がありません。`);
    process.exit(1);
  }

  for (const f of targets) {
    const name = basename(f, extname(f));
    const src = join(IN, f);

    if (extname(f).toLowerCase() === '.svg') {
      await copyFile(src, join(OUT, `${name}.svg`));
      console.log(`${f.padEnd(22)} → ${name}.svg  (ベクタなのでそのまま)`);
      continue;
    }

    const before = await sharp(src).metadata();
    // 余白を落として、絵の実寸を測る
    const cut = await (await trimmed(src)).png().toBuffer();
    const art = await sharp(cut).metadata();

    // 正方形に整える。長辺に合わせ、まわりに MARGIN ぶんの余白を足す
    const side = Math.max(art.width, art.height);
    const pad = Math.round(side * (MARGIN / (1 - MARGIN * 2)));
    const box = side + pad * 2;

    await sharp({
      create: { width: box, height: box, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: cut, left: Math.round((box - art.width) / 2), top: Math.round((box - art.height) / 2) }])
      .png()
      .toBuffer()
      .then((sq) => sharp(sq).resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(join(OUT, `${name}.png`)));

    const fill = ((side / Math.max(before.width, before.height)) * 100).toFixed(0);
    console.log(
      `${f.padEnd(22)} → ${name}.png  ` +
        `${before.width}x${before.height} (絵は${fill}%) → ${SIZE}x${SIZE}`
    );
  }

  console.log('\n仕上げ: components/quiz/QuizIcon.tsx の HAS_ICON に、置いたファイル名(拡張子なし)を足す');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
