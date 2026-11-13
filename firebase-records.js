/* SHORT Rells Firestore records adapter.
   Replaces the unavailable GitHub Pages "actions" endpoint.
   All authorization is enforced by Firestore Security Rules. */
(function () {
  function waitForFirebase() {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const check = () => {
        if (window.firebase && firebase.apps && firebase.apps.length &&
            firebase.firestore && firebase.auth) return resolve();
        if (++tries > 100) return reject(new Error("Firebase is not initialized. Refresh the page and try again."));
        setTimeout(check, 100);
      };
      check();
    });
  }
  function safeDocId(key) {
    return String(key).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 120) || undefined;
  }
  async function records(action, args) {
    await waitForFirebase();
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    const [namespace, operation] = String(action || "").split(".");
    if (namespace !== "records" || !["list", "create", "replace", "delete"].includes(operation)) {
      throw new Error("Unsupported records operation: " + action);
    }
    const collection = String(args && args.collection || "");
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(collection)) throw new Error("Invalid collection name.");
    const ref = db.collection(collection);

    if (operation === "list") {
      let query = ref;
      if (collection.startsWith("novaflix_")) {
        if (!user) return { records: [] };
        query = query.where("ownerUid", "==", user.uid);
      }
      const max = Math.min(Math.max(Number(args.limit) || 100, 1), 500);
      const snap = await query.limit(max).get();
      return { records: snap.docs.map(doc => {
        const data = doc.data() || {};
        return { id: doc.id, value: data.value !== undefined ? data.value : data,
          created_at: data.created_at || null };
      }) };
    }

    if (collection.startsWith("novaflix_") && !user) {
      throw new Error("Sign in to save your personal list and watch progress.");
    }

    if (operation === "create") {
      const value = args.value && typeof args.value === "object" ? args.value : {};
      const id = safeDocId(args.idempotency_key);
      const doc = id ? ref.doc(id) : ref.doc();
      const payload = { value, created_at: new Date().toISOString() };
      if (collection.startsWith("novaflix_")) payload.ownerUid = user.uid;
      await doc.set(payload, { merge: false });
      return { id: doc.id, value };
    }

    const id = String(args.id || "");
    if (!id || id.includes("/")) throw new Error("A valid record id is required.");
    const doc = ref.doc(id);
    if (operation === "replace") {
      const value = args.value && typeof args.value === "object" ? args.value : {};
      const payload = { value, created_at: new Date().toISOString() };
      if (collection.startsWith("novaflix_")) payload.ownerUid = user.uid;
      await doc.set(payload, { merge: false });
      return { id, value };
    }
    await doc.delete();
    return { id };
  }
  window.shortRellsRecords = records;
})();
