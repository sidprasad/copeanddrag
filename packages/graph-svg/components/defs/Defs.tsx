import { FC } from 'react';
import { useSelector } from 'react-redux';
import { getArrowheadIDs } from '../../selectors/getArrowheadIDs';
import ArrowHead from './arrowheads/ArrowHead';

const Defs: FC = () => {

    const arrowheadIDs = useSelector(getArrowheadIDs);

    return (
        <defs>
            {
                arrowheadIDs.map((props, i) =>
                    <ArrowHead key={i} {...props}/>
                )
            }
            <ArrowHead id={'arrow'} size={10} color={'#333'}/>
        </defs>
    )
}

export { Defs };