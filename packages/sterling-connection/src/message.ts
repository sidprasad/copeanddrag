import {
  Click,
  DataJoin,
  EvalExpression,
  EvalResult,
  ProviderMeta
} from './payload';

export type MessageType = 'click' | 'data' | 'eval' | 'meta';

export type Msg<P = any> = {
  type: MessageType;
  version: number;
  payload?: P;
};

export interface SendClickMsg extends Msg<Click> {
  type: 'click';
}

export interface SendDataMsg extends Omit<Msg, 'payload'> {
  type: 'data';
}

export interface RecvDataMsg extends Required<Msg<DataJoin>> {
  type: 'data';
}

export interface SendEvalMsg extends Required<Msg<EvalExpression>> {
  type: 'eval';
}

export interface RecvEvalMsg extends Required<Msg<EvalResult>> {
  type: 'eval';
}

export interface SendMetaMsg extends Omit<Msg, 'payload'> {
  type: 'meta';
}

export interface RecvMetaMsg extends Required<Msg<ProviderMeta>> {
  type: 'meta';
}

export function newSendClickMsg(version: number, payload: Click): SendClickMsg {
  return {
    type: 'click',
    version,
    payload
  };
}

export function newSendDataMsg(version: number): SendDataMsg {
  return {
    type: 'data',
    version
  };
}

export function newSendEvalMsg(
  version: number,
  payload: EvalExpression
): SendEvalMsg {
  return {
    type: 'eval',
    version,
    payload
  };
}

export function newSendMetaMsg(version: number): SendMetaMsg {
  return {
    type: 'meta',
    version
  };
}

export function isRecvDataMsg(msg: Msg): msg is RecvDataMsg {
  return msg.type === 'data' && msg.payload !== undefined;
}

export function isRecvEvalMsg(msg: Msg): msg is RecvEvalMsg {
  return msg.type === 'eval' && msg.payload !== undefined;
}

export function isRecvMetaMsg(msg: Msg): msg is RecvMetaMsg {
  return msg.type === 'meta' && msg.payload !== undefined;
}
