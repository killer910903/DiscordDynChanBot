/* jshint esversion: 6 */
const fs = require("fs");

const guildConfigFolder = "./guildConfig";
const DynChanConfiguration = require("./DynChanConfiguration.js");

class DynChanGuild {
 constructor(id) {
  this.id = id;
  this.setup = {
   id: null,
   state: null,
   user: null,
   detail: "voice",
   reset: function() {
    this.state = "null";
    this.id = null;
    this.state = null;
    this.user = null;
    this.detail = "voice";
   }
  };
  this.data = {};
  this.channels = {};
  this.loadData();
  this.init();
 }

 loadData() {
  let data;
  let file = `${guildConfigFolder}/${this.id}.json`;
  if (!fs.existsSync(file)) file = "./configTemplate.json";
  data = require(file);
  this.data = data;
 }
 saveData() {
  let file = `${guildConfigFolder}/${this.id}.json`;
  fs.writeFileSync(file, JSON.stringify(this.data), "utf-8");
 }
 init() {
  this.data.configurations.forEach(c => {
   this.channels[c.id] = [];
  });
 }
 toggle(state = null) {
  if (state == null)
   if (this.data.toggle == "on") this.data.toggle = "off";
   else this.data.toggle = "on";
  else this.data.toggle = state;
  this.saveData();
 }
 setCustomPrefix(prefix) {
  if (prefix) this.data.customBotPrefix = prefix;
  else this.data.customBotPrefix = null;
  this.saveData();
 }
 newConfiguration() {
  let c = new DynChanConfiguration();
  this.data.configurations.push(c);
  this.saveData();
  return c.id;
 }
 delConfiguration(id) {
  let dc = null;
  for (let i = 0; i < this.data.configurations.length; i++) {
   let c = this.data.configurations[i];
   if (c.id == id) {
    dc = c.name;
    this.data.configurations.splice(i, 1);
   }
  }
  this.saveData();
  return dc;
 }
 setControlRoles(role) {
  if (this.data.controlRoles.includes(role)) {
   this.data.controlRoles.splice(this.data.controlRoles.indexOf(role), 1);
   this.saveData();
   return false;
  } else {
   this.data.controlRoles.push(role);
   this.saveData();
   return true;
  }
 }
 getConfiguration(id) {
  let cfg = null;
  this.data.configurations.forEach(c => {
   if (c.id == id) cfg = c;
  });
  return cfg;
 }
 hasTriggerRole(id) {
  if (this.data.configurations.find(c => c.id == this.setup.id).triggerRoles.find(r => r.id == id)) return true;
  else return false;
 }
 toggleTriggerRole(id) {
  let toggle = true;
  let c = this.data.configurations.find(c => c.id == this.setup.id);
  if (c.triggerRoles.includes(id)) {
   toggle = false;
   let index = c.triggerRoles.indexOf(id);
   c.triggerRoles.splice(index, 1);
  } else {
   toggle = true;
   this.data.configurations.find(c => c.id == this.setup.id).triggerRoles.push(id);
  }
  this.saveData();
  return toggle;
 }
 togglePermission(permission) {
  let toggle = true;
  let c = this.data.configurations.find(c => c.id == this.setup.id);
  if (c.permissions.includes(permission)) {
   toggle = false;
   let index = c.permissions.indexOf(permission);
   c.permissions.splice(index, 1);
  } else {
   toggle = true;
   this.data.configurations.find(c => c.id == this.setup.id).permissions.push(permission);
  }
  this.saveData();
  return toggle;
 }
}
module.exports = DynChanGuild;
