const ShortUniqueId = require("short-unique-id");
var uid = new ShortUniqueId();
var list = [];
for (let i = 0; i < 10; i++) {
 let id = uid.randomUUID(12);
 if (list.includes(id)) console.log(id);
 list.push(id);
}
