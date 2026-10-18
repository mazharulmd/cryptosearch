const { MongoDb, } = require('../mongodb');
const { UIDGenerator } = require("@shahadul-17/uid-generator");

const uidGenerator = UIDGenerator.create();

module.exports.generateUidAsync = async () => {
  const database = MongoDb.getInstance().getDatabase();
  const uid = database.collection('UID');
  const lastGeneratedUid = await uid.findOne({ _id: 'LAST_GENERATED_ID', });

  lastGeneratedUid && uidGenerator.setLast(lastGeneratedUid.value);

  const generatedUid = uidGenerator.generate();

  await uid.updateOne({ _id: 'LAST_GENERATED_ID', }, {
    $set: {
      value: generatedUid,
    },
  }, { upsert: true, });

  return generatedUid;
};
