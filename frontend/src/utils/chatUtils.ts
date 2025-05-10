let alreadySentReadyToPlay: boolean = false;

export function setReadyToPlaySent(val: boolean): void {
  alreadySentReadyToPlay = val;
}

export function hasSentReadyToPlay(): boolean {
  return alreadySentReadyToPlay;
}