export class Reference {
	constructor(
		private readonly filename: string,
		private readonly lineNumber: number,
	) {}

	toString() {
		const filename = this.filename.replace('\n', '\\n');

		return `${filename}:${this.lineNumber}`;
	}
}
