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
			Textdomain.N_('Sunday'),
			Textdomain.N_('Monday'),
			Textdomain.N_('Tuesday'),
			Textdomain.N_('Wednesday'),
			Textdomain.N_('Thursday'),
			Textdomain.N_('Friday'),
			Textdomain.N_('Saturday'),
		];

		if (id < 0 || id > weekDays.length) {
			return null;
		}

		return gtx._(weekDays[id]);
	}
}
