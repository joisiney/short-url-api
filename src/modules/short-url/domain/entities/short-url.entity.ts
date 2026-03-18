export class ShortUrl {
  id: string;
  url: string;
  shortCode: string;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Omit<ShortUrl, 'incrementAccess' | 'updateOriginalUrl'>) {
    this.id = props.id;
    this.url = props.url;
    this.shortCode = props.shortCode;
    this.accessCount = props.accessCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  incrementAccess(): void {
    this.accessCount++;
  }

  updateOriginalUrl(newUrl: string): void {
    this.url = newUrl;
    this.updatedAt = new Date();
  }
}
