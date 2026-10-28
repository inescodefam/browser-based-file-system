export class ItemAlreadyExistsError extends Error {
  constructor(
    public readonly itemName: string,
    public readonly parentId: string | null,
  ) {
    super(`An item named "${itemName}" already exists in this folder`);
    this.name = 'ItemAlreadyExistsError';
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

export class ParentIsNotFolderError extends Error {
  constructor(
    public readonly parentId: string,
    public readonly parentName: string,
  ) {
    super(`"${parentName}" is a file, not a folder`);
    this.name = 'ParentIsNotFolderError';
  }
}

export class ItemNotFoundError extends Error {
  constructor(public readonly itemId: string) {
    super(`Item "${itemId}" does not exist`);
    this.name = 'ItemNotFoundError';
  }
}