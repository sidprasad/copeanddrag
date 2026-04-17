import { ChevronRightIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { LogText } from './LogText';

interface LogEntryProps {
  text: string;
  variant: 'message' | 'warning' | 'error';
  time?: Date;
}

const LogEntry = (props: LogEntryProps) => {
  const { text, variant, time } = props;
  return (
    <>
      <LogText variant='timestamp' justifySelf='end'>
        {time ? format(time, 'HH:mm:ss') : '--:--:--'}
        <ChevronRightIcon />
      </LogText>
      <LogText variant={variant}>{text}</LogText>
    </>
  );
};

export { LogEntry };
