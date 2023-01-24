function sync(doc, oldDoc) {

    console.log("********Procesing Doc. Is oldDoc == null? " + (oldDoc == null));

    // tag::data-validation[]
    /* Data Validation */

    // Validate the presence of email field.
    // This is the "username" <.>
    validateNotEmpty("email", doc.email);

    // Validate that the document Id _id is prefixed by owner <.>
    var expectedDocId = "user" + "::" + doc.email;

    // <.>
    if (expectedDocId != doc._id) {
      // reject document
      throw({forbidden: "user doc Id must be of form user::email"});
    }
    // end::data-validation[]

   try {

       // Check if this is an import processing (done with admin credentials)
       requireAdmin();
       if (!isDelete()) {
           /* Routing */

           var username = getEmail();
           var channelId = "channel."+ username;

           channel(channelId);

           // Give user access to document
           access(username,channelId);
        }
    }catch (error) {
       console.log("This is not a doc import " + error);

       // If non admin client replication
       if (!isDelete()) {

         // tag::authorization[]
         /* Authorization */

         // Verify the user making the request is the same as the one in doc's email
         requireUser(doc.email);

         // end::authorization[]
         // Check if document is being created / added for first time
         // We allow any user to create the document
         if (isCreate()) {

            // tag::routing[]
            /* Routing */

            // Add doc to the user's channel.
            var username = getEmail(); // <.>

            var channelId = "channel."+ username; // <.>

            channel(channelId); // <.>
            // end::routing[]

            // tag::access-control[]
            // Give user access to document <.>
            access(username, channelId);

            // end::access-control[]
          } else {

              // This is an update
              // Validate that the email hasn't changed.

              validateReadOnly("email", doc.email, oldDoc.email);

                // Add doc to the user's channel.
                var username = getEmail();
              var channelId = "channel."+ username;

              channel(channelId);

              // Give user access to document
              access(username,channelId);

          }

       }

    }



  // get type property
  function getType() {
    return (isDelete() ? oldDoc.type : doc.type);
  }

  // get email Id property
  function getEmail() {
    return (isDelete() ? oldDoc.email : doc.email);
  }

  // Check if document is being created/added for first time
  function isCreate() {
    // Checking false for the Admin UI to work
    return ((oldDoc == false) || (oldDoc == null || oldDoc._deleted) && !isDelete());
  }

  // Check if this is a document update
  function isUpdate() {
    return (!isCreate() && !isDelete());
  }

  // Check if this is a document delete
  function isDelete() {
    return (doc._deleted == true);
  }

  // Verify that specified property exists
  function validateNotEmpty(key, value) {
    if (!value) {
      throw({forbidden: key + " is not provided."});
    }
  }

  // Verify that specified property value has not changed during update
  function validateReadOnly(name, value, oldValue) {
    if (value != oldValue) {
      throw({forbidden: name + " is read-only."});
    }
  }


}