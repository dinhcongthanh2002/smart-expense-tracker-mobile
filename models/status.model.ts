/** Lifecycle status a slice records so components can react to the last event. */
export enum EStatusState {
  idle = "idle",
  setFulfilled = "set.fulfilled",

  getPending = "get.pending",
  getFulfilled = "get.fulfilled",
  getRejected = "get.rejected",

  getByIdPending = "getById.pending",
  getByIdFulfilled = "getById.fulfilled",
  getByIdRejected = "getById.rejected",

  postPending = "post.pending",
  postFulfilled = "post.fulfilled",
  postRejected = "post.rejected",

  putPending = "put.pending",
  putFulfilled = "put.fulfilled",
  putRejected = "put.rejected",

  deletePending = "delete.pending",
  deleteFulfilled = "delete.fulfilled",
  deleteRejected = "delete.rejected",
}
