import { describe, expect, test, jest, beforeEach } from '@jest/globals';

import Logger from '../src/Logger';

describe('Logger', () => {

    const console_log_spy = jest.spyOn(console, 'log');

    const PREFIX = 'Prefix1';
    const PREFIX_STR = Logger.makePrefixStr(PREFIX);
    const STR1 = 'String1';
    const STR2 = 'String2';
    const STR3 = 'String3';
    const STR4 = 'String4';

    const DEFAULTFILTER = Logger.DEFAULT_TAG;
    const FILTER1 = 'filter1';
    const FILTER2 = 'filter2';
    const FILTER3 = 'filter3';

    const DEFAULTFILTERSTR = Logger.makeFilterStr(DEFAULTFILTER);
    const FILTER1STR = Logger.makeFilterStr(FILTER1);
    const FILTER2STR = Logger.makeFilterStr(FILTER2);
    const FILTER3STR = Logger.makeFilterStr(FILTER3);

    const logger = new Logger(true, PREFIX);

    beforeEach(() => {
        console_log_spy.mockClear();
    });

    test('Logs string with prefix when enabled', () => {
        logger.log(STR1);
        expect(console_log_spy).toHaveBeenCalledWith(PREFIX_STR, STR1, DEFAULTFILTERSTR);
    });

    test('Logs multiple variables', () => {
        logger.log([STR1, STR2, STR3]);
        expect(console_log_spy).toHaveBeenCalledWith(PREFIX_STR, STR1, STR2, STR3, DEFAULTFILTERSTR);
    });

    test("Doesn't log when disabled", () => {
        logger.enabled = false;
        logger.log([STR1]);
        expect(console_log_spy).not.toHaveBeenCalled();
    });

    test("Logs when matching filters are enabled", () => {
        logger.enabled = true;
        logger.filter = FILTER1;
        logger.log(STR1, FILTER1);

        expect(console_log_spy).toHaveBeenCalledTimes(1);

        logger.filter = [ FILTER2, FILTER3 ];
        logger.log(STR2, FILTER2);
        logger.log(STR3, FILTER3);

        expect(console_log_spy).toHaveBeenCalledTimes(3);
    });

    test("Doesn't log when no matching filters are found", () => {
        logger.filter = FILTER1;

        logger.log(STR1, FILTER2);
        logger.log(STR2, FILTER2);

        expect(console_log_spy).not.toHaveBeenCalled();

        logger.filter = [FILTER2, FILTER3];

        logger.log(STR3, FILTER1);

        expect(console_log_spy).not.toHaveBeenCalled();
    });
});

