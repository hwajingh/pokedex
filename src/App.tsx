import * as React from "react";
import axios from "axios";
import styles from "./App.module.css";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";

import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";

import { getTypeString, makeUpper } from "./helper";
import Button from "@mui/material/Button";
import logo from "./pokemonlogo.png";
import pokeball from "./pokeball.jpeg";
import TextField from "@mui/material/TextField";

// https://reactjs.org/docs/hooks-rules.html

export interface PokemonType {
  name: string;
  sprites: { front_default: string };
  // declaring type
  types: { type: { name: string } }[];
  height: number;
  weight: number;
}

function App() {
  // const [expanded, setExpanded] = React.useState(false);
  const [pokemon, setPokemon] = React.useState<PokemonType>({
    name: "",
    sprites: { front_default: "" },
    types: [{ type: { name: "" } }],
    height: 0,
    weight: 0,
  });
  const [id, setId] = React.useState(1);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // declaring value

  // const handleExpandClick = () => {
  //   setExpanded(!expanded);
  // };

  React.useEffect(() => {
    // Update the document title using the browser API

    // FIX: depend on `id` only. `pokemon` used to be in the deps, so every
    // successful fetch created a new pokemon object and re-triggered the
    // effect — an unbounded refetch loop.
    setError(null);
    axios
      .get(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(function (response) {
        // handle success
        setPokemon(response.data);
      })
      .catch(function () {
        setError("Could not load that Pokémon. Please try another name or id.");
      });
  }, [id]);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <img className={styles.image} src={logo} alt="" />
        <div className={styles.searchBar}>
          <TextField
            className={styles.search}
            id="filled-basic"
            label="Search pokemon name"
            variant="filled"
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="contained"
            disabled={name === ""}
            onClick={async () => {
              // FIX: normalise the query and only setId(). The effect above
              // then does the single fetch — previously the handler fetched
              // AND setPokemon, then setId triggered the effect fetch again.
              const query = name.trim().toLowerCase();
              if (!query) {
                return;
              }
              setError(null);
              axios
                .get(`https://pokeapi.co/api/v2/pokemon/${query}`)
                .then(function (response) {
                  // handle success
                  setId(response.data.id);
                })
                .catch(function () {
                  setError(
                    "Could not find that Pokémon. Please check the name and try again."
                  );
                });
            }}
          >
            search
          </Button>
        </div>
        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        <Card sx={{ maxWidth: 345 }}>
          <CardHeader
            avatar={
              <Avatar src={pokeball} aria-label="">
                R
              </Avatar>
            }
            title={makeUpper(pokemon.name)}
            subheader={getTypeString(pokemon.types)}
          />
          <CardMedia
            component="img"
            height="400"
            width="400"
            image={pokemon.sprites.front_default}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {makeUpper(pokemon.name)} is {pokemon.height}0cm tall and weighs{" "}
              {/* FIX: PokeAPI weight is in hectograms, so divide by 10 for kg. */}
              {pokemon.weight / 10}kg.
            </Typography>
          </CardContent>
        </Card>
        <div className={styles.buttonRow}>
          <Button
            variant="contained"
            disabled={id === 1}
            onClick={() => {
              if (id > 1) {
                setId(id - 1);
              }
            }}
          >
            previous
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setId(id + 1);
            }}
          >
            next
          </Button>
        </div>
      </div>
      <div className={styles.footer}>Made by Tiger Hong</div>
    </div>
  );
}

export default App;
