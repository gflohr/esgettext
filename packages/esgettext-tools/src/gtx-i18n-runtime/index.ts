// Dummy gettext implementation.
export class Gtx {
	constructor(textdomain: string) {}

	_(msgid: string) {
		return msgid;
	}

	N_(msgid: string) {
		return msgid;
	}
}
