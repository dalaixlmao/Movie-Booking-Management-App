import {selector} from 'recoil';
import { movieSearchParam } from '../atoms/searchParams';

export const movieIdState = selector({
    key:'movieIdSelector',
    get:({get})=>{
        const id = get(movieSearchParam);
        return id;
    }
})