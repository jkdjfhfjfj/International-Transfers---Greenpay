/**
 * Crypto payments are available worldwide when both admin switches are on
 * and an active receiving address exists. Country never gates this method.
 */
export function isCryptoAvailableForCountry(
  _country: unknown,
  globalEnabled: boolean,
  cryptoEnabled: boolean,
  hasActiveAddress: boolean,
): boolean {
  return globalEnabled && cryptoEnabled && hasActiveAddress;
}
