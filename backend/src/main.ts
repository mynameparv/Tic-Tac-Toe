import { matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './match_handler';
import { rpcFindMatch } from './rpc';

const InitModule: nkruntime.InitModule = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  logger.info('Initializing Tic-Tac-Toe backend...');

  initializer.registerRpc('rpcFindMatch', rpcFindMatch);

  initializer.registerMatch('tic-tac-toe', {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal,
  });

  logger.info('Tic-Tac-Toe backend initiated.');
};

// Reference InitModule to avoid it being removed by Rollup
!(InitModule as any) && (InitModule as any).bind(null);
