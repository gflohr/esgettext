export class Reference {
	constructor(
		private readonly filename: string,
		private readonly lineNumber: number,
	) {}

	toString(): string {
		const filename = this.filename.replace('\n', '\\n');

		return `${filename}:${this.lineNumber}`;
	}

	compare(other: Reference): number {
		return (
			this.filename.localeCompare(other.filename) ||
			Math.sign(this.lineNumber - other.lineNumber)
		);
	}
}
