import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('com.cantanea.sample-calendar-library');

export class CalendarStrings {
	public getMonth(id: number): string {
		const months = [
			Textdomain.N_('January'),
			Textdomain.N_('February'),
			Textdomain.N_('March'),
			Textdomain.N_('April'),
			Textdomain.N_('May'),
			Textdomain.N_('June'),
			Textdomain.N_('July'),
			Textdomain.N_('August'),
			Textdomain.N_('September'),
			Textdomain.N_('October'),
			Textdomain.N_('November'),
			Textdomain.N_('December')
		];

		if (id < 0 || id > months.length) {
			return null;
		}

		return gtx._(months[id]);
	}

	public getAbbreviatedWeekDay(id: number): string {
		const weekDays = [
			Textdomain.N_('Sun'),
			Textdomain.N_('Mon'),
			Textdomain.N_('Tue'),
			Textdomain.N_('Wed'),
			Textdomain.N_('Thu'),
			Textdomain.N_('Fri'),
			Textdomain.N_('Sat'),
		];

		if (id < 0 || id > weekDays.length) {
			return null;
		}

		return gtx._(weekDays[id]);
	}
}
