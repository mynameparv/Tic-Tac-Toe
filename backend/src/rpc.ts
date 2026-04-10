export const rpcFindMatch: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
) {
  if (!ctx.userId) {
    throw new Error('No user ID in context');
  }

  const limit = 10;
  const isAuthoritative = true;
  const label = 'tic-tac-toe';
  const minSize = 1;
  const maxSize = 1; // Looking for matches with 1 player waiting

  const matches = nk.matchList(limit, isAuthoritative, label, minSize, maxSize, "");

  if (matches.length > 0) {
    return JSON.stringify({ matchId: matches[0].matchId });
  }

  const matchId = nk.matchCreate('tic-tac-toe');
  return JSON.stringify({ matchId });
};
