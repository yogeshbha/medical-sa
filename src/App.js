import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage, Auth } from "aws-amplify";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  SelectField,
  View,
  withAuthenticator,
  FileUploader,
  Image,
  Divider,
  useTheme,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import { Login } from "./login"


const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.file) {
          const url = await Storage.get(note.name);
          note.file = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const file = form.get("file");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      language: form.get("language"),
      file: file.name,
    };
    if (!!data.file) await Storage.put(data.name + " - " + data.description, file);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>AnyCompany Medical</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Patient Name"
            label="Patient Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="File Description"
            label="File Description"
            labelHidden
            variation="quiet"
            required
          />
          <SelectField
            name="language"
            // label="Language to Translate to"
            placeholder="Please select a language to translate to"
          >
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
            <option value="fr">French</option>
          </SelectField>
          <View
            name="file"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />          
          {/* <FileUploader
            variation="button"
            acceptedFileTypes={['image/*', '.pdf', '.docx']}
            level="private"
            name="file */
          /* /> */}
          <Button type="submit" variation="primary">
            Upload File for Translation
          </Button>
        </Flex>
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);

// export default function App() {
//   const { user } = useAuthenticator();

//   if (user) {
//     return <Home />;
//   }

//   return <Login />;
// }