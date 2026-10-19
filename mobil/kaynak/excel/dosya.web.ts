/** Web: tarayıcı indirmesi ve dosya seçici */
export async function dosyaIndir(ad: string, veri: Uint8Array | string, mime: string): Promise<void> {
  const blob = new Blob([veri as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function dosyaSec(): Promise<{ ad: string; veri: Uint8Array } | null> {
  return new Promise((coz) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    inp.style.display = 'none';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      inp.remove();
      if (!f) return coz(null);
      coz({ ad: f.name, veri: new Uint8Array(await f.arrayBuffer()) });
    };
    document.body.appendChild(inp);
    inp.click();
  });
}

export const DOSYA_SECICI_VAR = true;
