import { CalendarStrings } from './calendar-strings';

describe('Month names', () => {
	const cs = new CalendarStrings();

	it('should get the name of the month March', () => {
		expect(cs.getMonth(2)).toEqual('March');
	});

	it('should fail for a negative month number', () => {
		expect(cs.getMonth(-2304)).toBeNull();
	});

	it('should fail for a month number out of range', () => {
		expect(cs.getMonth(2304)).toBeNull();
	});
});

describe('Abbreviated weekday names', () => {
	const cs = new CalendarStrings();

	it('should get the name of the weekday Monday', () => {
		expect(cs.getAbbreviatedWeekDay(1)).toEqual('Monday');
	});

	it('should fail for a negative weekday number', () => {
		expect(cs.getAbbreviatedWeekDay(-2304)).toBeNull();
	});

	it('should fail for a weekday number out of range', () => {
		expect(cs.getAbbreviatedWeekDay(2304)).toBeNull();
	});
});
