export class CalendarStrings {
	public getMonth(id: number): string {
		const months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];

		if (id < 0 || id > months.length) {
			return null;
		}

		return months[id];
	}
}
