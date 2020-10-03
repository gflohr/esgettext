import { CalendarStrings } from './calendar-strings';

describe('Month names', () => {
	const cs = new CalendarStrings();

	it('should get the name of the month March', () => {
		expect(cs.getMonth(2)).toEqual('March');
	})
});
