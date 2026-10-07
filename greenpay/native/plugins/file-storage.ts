import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export class FileStorage {
  static async saveFile(filename: string, data: string) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      console.log('File saved:', result);
      return result;
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  static async readFile(filename: string) {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return result.data;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  static async deleteFile(filename: string) {
    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Documents,
      });
      console.log('File deleted:', filename);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  static async listFiles() {
    try {
      const result = await Filesystem.readdir({
        path: '.',
        directory: Directory.Documents,
      });
      return result.files;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  static async saveCacheData(key: string, data: any) {
    const filename = `.cache_${key}.json`;
    return this.saveFile(filename, JSON.stringify(data));
  }

  static async getCacheData(key: string) {
    const filename = `.cache_${key}.json`;
    const data = await this.readFile(filename);
    return data ? JSON.parse(data as string) : null;
  }
}
