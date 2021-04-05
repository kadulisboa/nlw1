import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import logo from '../../assets/logo.svg';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../../services/api';

import './styles.css';

interface Item {
    id: number;
    title: string;
    image_url: string;
}
interface Uf {
    id: number;
    nome: string;
    sigla: string;
}
interface Cities {
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        number: ''
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const [ufs, setUfs] = useState<Uf[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');

    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, [])

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            setUfs(response.data);
        });
    }, []);

    useEffect(() => {
        if (selectedUf === "0") {
            return;
        }
        axios.get<Cities[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome);
            setCities(cityNames);
        });
    }, [selectedUf]);

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city);
    }

    function HandleMapClick() {
        useMapEvents({
            click: (location) => {
                setSelectedPosition([
                    location.latlng.lat,
                    location.latlng.lng
                ]);
            },
        });
        return null;
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    function UserPosition() {
        const map = useMapEvents({
            locationfound: () => {
                map.setView(initialPosition);
            }
        });
        map.locate();

        return null;
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setFormData({ ...formData, [name]: value });
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp, number } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            number,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data);

        alert('Ponto de Coleta criado!');

        history.push('/');

    }
    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Logo Ecoleta" />
                <Link to="/" >
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br />ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>
                            Dados
                        </h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">
                            Nome da entendidade
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">
                                E-mail
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">
                                Whatsapp
                            </label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>
                            Endereço
                        </h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <MapContainer center={initialPosition} zoom={15}>
                        <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}>
                            <UserPosition />
                            <HandleMapClick />
                        </Marker>
                    </MapContainer>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="number">
                                Número
                            </label>
                            <input
                                type="text"
                                name="number"
                                id="number"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="uf">
                                Estado (UF)
                            </label>
                            <select
                                name="uf"
                                id="uf"
                                value={selectedUf}
                                onChange={handleSelectUf}
                            >
                                <option value="0">Selecione um UF</option>
                                {ufs.map(uf => (
                                    <option value={uf.id} key={uf.id}>{uf.sigla}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="city">
                            Cidade
                            </label>
                        <select
                            name="city"
                            id="city"
                            value={selectedCity}
                            onChange={handleSelectCity}
                        >
                            <option value="0">Selecione uma cidade</option>
                            {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>
                            Ítems de coleta
                        </h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li
                                key={item.id}
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}

                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint;
