let alreadySentReadyToPlay = false;

export function setReadyToPlaySent(val: boolean) {
  alreadySentReadyToPlay = val;
}

export function hasSentReadyToPlay(): boolean {
  return alreadySentReadyToPlay;
}