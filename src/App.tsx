import * as React from "react";
import axios from "axios";
import styles from "./App.module.css";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";

import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";

import { getTypeString, makeUpper, filterPokemonNames } from "./helper";
import Button from "@mui/material/Button";
import logo from "./pokemonlogo.png";
import pokeball from "./pokeball.jpeg";
import TextField from "@mui/material/TextField";

export interface PokemonType {
  name: string;
  sprites: { front_default: string };
  types: { type: { name: string } }[];
  height: number;
  weight: number;
}

const MAX_SUGGESTIONS = 10;

function App() {
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [allNames, setAllNames] = React.useState<string[]>([]);
  const [listLoaded, setListLoaded] = React.useState(false);
  const [listFailed, setListFailed] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  // The full name list, fetched once for the search dropdown.
  React.useEffect(() => {
    axios
      .get("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0")
      .then(function (response) {
        setAllNames(
          response.data.results.map(function (entry: { name: string }) {
            return entry.name;
          })
        );
        setListLoaded(true);
      })
      .catch(function () {
        setListFailed(true);
      });
  }, []);

  React.useEffect(() => {
    // Depend on `id` only, so a successful fetch does not re-trigger itself.
    setError(null);
    setIsLoading(true);
    axios
      .get(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(function (response) {
        setPokemon(response.data);
      })
      .catch(function () {
        setError("Could not load that Pokémon. Please try another name or id.");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }, [id]);

  const query = name.trim().toLowerCase();
  const suggestions = listLoaded
    ? filterPokemonNames(allNames, query, MAX_SUGGESTIONS)
    : [];
  const dropdownOpen = showSuggestions && query !== "" && !listFailed;

  const loadByName = (selected: string) => {
    setError(null);
    setIsLoading(true);
    axios
      .get(`https://pokeapi.co/api/v2/pokemon/${selected}`)
      .then(function (response) {
        setId(response.data.id);
      })
      .catch(function () {
        setError("Could not load that Pokémon. Please try again.");
      })
      .finally(function () {
        setIsLoading(false);
      });
  };

  const selectSuggestion = (selected: string) => {
    setName(selected);
    setShowSuggestions(false);
    setActiveIndex(-1);
    loadByName(selected);
  };

  // Search is a form submit, so Enter works like tapping Search.
  // With the name list loaded, a miss is answered by the dropdown's
  // "No Pokémon match" row, not an error banner. The direct search
  // below only runs as a fallback when the list itself failed to load.
  const handleSearch = () => {
    if (!query) {
      return;
    }
    if (listLoaded) {
      if (allNames.includes(query)) {
        loadByName(query);
      }
      return;
    }
    if (listFailed) {
      loadByName(query);
      return;
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length === 0) {
        return;
      }
      setShowSuggestions(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length === 0) {
        return;
      }
      setShowSuggestions(true);
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      // An highlighted suggestion wins over the form submit.
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <img className={styles.image} src={logo} alt="Pokémon logo" />
        <form
          className={styles.searchBar}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className={styles.searchWrap}>
            <TextField
              className={styles.search}
              id="filled-basic"
              label="Pokemon Name"
              variant="filled"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onFocus={() => {
                if (name.trim() !== "") {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={handleInputKeyDown}
              inputProps={{
                role: "combobox",
                "aria-expanded": dropdownOpen,
                "aria-controls": "pokemon-suggestions",
                "aria-activedescendant":
                  activeIndex >= 0
                    ? `pokemon-suggestion-${activeIndex}`
                    : undefined,
                autoComplete: "off",
              }}
            />
            {dropdownOpen && (
              <ul
                id="pokemon-suggestions"
                role="listbox"
                className={styles.suggestions}
              >
                {!listLoaded && (
                  <li className={styles.noMatch}>Loading Pokémon list…</li>
                )}
                {listLoaded && suggestions.length === 0 && (
                  <li className={styles.noMatch}>
                    {`No Pokémon match "${query}".`}
                  </li>
                )}
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    id={`pokemon-suggestion-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={
                      index === activeIndex ? styles.activeOption : undefined
                    }
                    onMouseDown={(e) => {
                      // Select before the input blurs and closes the list.
                      e.preventDefault();
                      selectSuggestion(suggestion);
                    }}
                  >
                    {makeUpper(suggestion)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            type="submit"
            variant="contained"
            disabled={name.trim() === "" || isLoading}
            sx={{ minHeight: 44 }}
          >
            search
          </Button>
        </form>
        {isLoading && (
          <Typography sx={{ marginBottom: 2 }}>Loading…</Typography>
        )}
        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        {pokemon.name ? (
          <Card sx={{ maxWidth: 345, width: "100%" }}>
            <CardHeader
              avatar={
                <Avatar src={pokeball} aria-label="Pokéball">
                  R
                </Avatar>
              }
              title={makeUpper(pokemon.name)}
              subheader={getTypeString(pokemon.types)}
            />
            <CardMedia
              component="img"
              image={pokemon.sprites.front_default}
              alt={makeUpper(pokemon.name)}
              sx={{
                display: "block",
                width: "100%",
                // Fixed height: every sprite gets the same viewport, so the
                // card never reshapes when the next image is a different size.
                height: 320,
                objectFit: "contain",
                backgroundColor: "#f5f5f5",
              }}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {makeUpper(pokemon.name)} is {pokemon.height}0cm tall and
                weighs{" "}
                {/* PokeAPI weight is in hectograms; divide by 10 for kg. */}
                {pokemon.weight / 10}kg.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
        <div className={styles.buttonRow}>
          <Button
            variant="contained"
            disabled={id === 1 || isLoading}
            sx={{ minHeight: 44 }}
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
            disabled={isLoading}
            sx={{ minHeight: 44 }}
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
