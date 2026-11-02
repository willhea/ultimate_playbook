/**
 * Saving a file. Inside the claude.ai artifact viewer, pages can't start downloads
 * themselves; the viewer offers a `downloads` capability instead. Anywhere else a
 * normal browser download works.
 */
interface HostDownloads {
  save(request: { filename: string; data: string }): Promise<unknown>;
}

interface HostWindow {
  claude?: { use(name: string): Promise<unknown> };
}

export type DownloadSupport = { kind: 'browser' } | { kind: 'host'; downloads: HostDownloads } | { kind: 'none' };

export async function detectDownloads(): Promise<DownloadSupport> {
  const host = (window as unknown as HostWindow).claude;
  if (!host) return { kind: 'browser' };
  try {
    const downloads = (await host.use('downloads')) as HostDownloads | null;
    return downloads ? { kind: 'host', downloads } : { kind: 'none' };
  } catch {
    return { kind: 'none' };
  }
}

/** Resolves true when the file was handed over, false if the viewer declined. */
export async function saveFile(support: DownloadSupport, filename: string, text: string): Promise<boolean> {
  if (support.kind === 'host') {
    try {
      await support.downloads.save({ filename, data: text });
      return true;
    } catch {
      return false;
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
