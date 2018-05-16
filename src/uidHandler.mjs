import { recordName } from "./yuml2dot-utils";

export default class {
  constructor() {
    this._uidNb = 0;
    this._uids = {};
  }

  /**
   *
   * @param {string} label
   * @param {(recordName: string)=>string} [callback]
   * @returns {boolean | string} False if the UID already has already been
   *                             created, or the created UID
   */
  createUid(label, callback) {
    const recordNameLabel = recordName(label);

    return (
      !this._uids.hasOwnProperty(recordNameLabel) &&
      (this._uids[recordNameLabel] = callback
        ? callback("A" + this._uidNb++)
        : "A" + this._uidNb++)
    );
  }

  getUid(label) {
    return this._uids[recordName(label)];
  }
}
