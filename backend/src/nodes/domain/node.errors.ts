export class NodeAlreadyExistsError extends Error {
  constructor(
    public readonly nodeName: string,
    public readonly parentId: string | null,
  ) {
    super(`A node named "${nodeName}" already exists in this folder`);
    this.name = 'NodeAlreadyExistsError';
  }
}

export class ParentNotFoundError extends Error {
  constructor(public readonly parentId: string) {

    // select parent name
    // const parentName = await this.getParentName(parentId); __TODO__: implement this method to retrieve the parent name from the database or any other source
    super(`Parent folder "${parentId}" does not exist`);
    this.name = 'ParentNotFoundError';
  }
}