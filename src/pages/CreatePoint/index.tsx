import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Map, Marker, TileLayer } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import api from "../../services/api";
import axios from "axios";
import logo from "../../assets/logo.svg";
import "./styles.css";

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface UF {
  id: number;
  initials: string;
  name: string;
}

interface IBGEUFResponse {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  name: string;
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [uf, setUf] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedUF, setSelectedUF] = useState<String>("");
  const [selectedCity, setSelectedCity] = useState<String>("");
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedMarker, setSelectedMarker] = useState<[number, number]>([
    0,
    0,
  ]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    api.get("/items").then((response) => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    axios
      .get<IBGEUFResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados/"
      )
      .then((response) => {
        const formattedUf = response.data.map((uf) => ({
          id: uf.id,
          initials: uf.sigla,
          name: uf.nome,
        }));
        setUf(formattedUf);
      });
  }, []);

  useEffect(() => {
    if (selectedUF !== "") {
      axios
        .get<IBGECityResponse[]>(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
        )
        .then((response) => {
          const formattedCity = response.data.map((city) => ({
            id: city.id,
            name: city.nome,
          }));
          setCities(formattedCity);
        });
    }
  }, [selectedUF]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((response) => {
      const { latitude, longitude } = response.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  const handleSelectedUF = (name: String) => {
    setSelectedUF(name);
  };

  const handleSelectedCity = (name: String) => {
    setSelectedCity(name);
  };

  const handleMapClick = (event: LeafletMouseEvent) => {
    const { lat, lng } = event.latlng;
    setSelectedMarker([lat, lng]);
  };

  const handleFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectedItem = (id: number) => {
    if (selectedItems.includes(id)) {
      const filteredList = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredList);
      return;
    }
    setSelectedItems([...selectedItems, id]);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const items = selectedItems;
    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      items,
      latitude: selectedMarker[0],
      longitude: selectedMarker[1],
    };
    await api.post("/points", data);
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro <br /> do ponto de coleta
        </h1>
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleFormData}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                name="email"
                id="email"
                onChange={handleFormData}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleFormData}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço de coleta no mapa</span>
          </legend>

          <Map
            center={
              initialPosition !== [0, 0]
                ? initialPosition
                : [-16.6688266, -49.2069194]
            }
            zoom={15}
            onClick={handleMapClick}
          >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedMarker} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={String(selectedUF)}
                onChange={(evt) => handleSelectedUF(String(evt.target.value))}
              >
                <option value="0">Selecione uma opção</option>
                {uf.map((uf) => (
                  <option value={uf.initials} key={uf.id}>
                    {uf.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={String(selectedCity)}
                onChange={(evt) => handleSelectedCity(String(evt.target.value))}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option value={city.name} key={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                className={selectedItems.includes(item.id) ? "selected" : ""}
                onClick={() => handleSelectedItem(item.id)}
              >
                <img src={String(item.image_url)} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
