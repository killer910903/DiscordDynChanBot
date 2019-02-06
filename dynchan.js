class DynChan {
  constructor(id, owner, configuration) {
    this.id = id;
    this.originOwner = owner;
    this.currentOwner = owner;
    this.configuration = configuration;
  }
}
module.exports = DynChan;
