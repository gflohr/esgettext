export class Reference {
	constructor(readonly filename: string, readonly lineNumber: number) {}

	toString(): string {
		return `${this.filename}:${this.lineNumber}`;
	}

	compare(other: Reference): number {
		return (
			this.filename.localeCompare(other.filename) ||
			Math.sign(this.lineNumber - other.lineNumber)
		);
	}
}
