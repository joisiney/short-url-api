export class UrlAlreadyShortenedError extends Error {
  constructor(url: string) {
    super(`A URL "${url}" já foi encurtada.`);
    this.name = 'UrlAlreadyShortenedError';
  }
}
