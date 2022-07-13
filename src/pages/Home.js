import React from 'react';
import axios from 'axios';
import RecipeCard from './../components/RecipeCard';
import LoadingSpinner from './../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const BASE_API_URL = 'https://coffeetalk-api.herokuapp.com/';

export default class Home extends React.Component {
	state = {
		latestRecipes: [],
		popularRecipes: [],
		contentLoaded: false
	};

	// --- Functions ---
	async componentDidMount() {
		// Loading JSON Files in parallel
		let latestRecipesRequest = axios.get(
			BASE_API_URL + 'recipes?sort=date&limit=3'
		);
		let popularRecipesRequest = axios.get(
			BASE_API_URL + 'recipes?sort=rating&limit=3'
		);

		let [latestRecipesResponse, popularRecipesResponse] = await axios.all([
			latestRecipesRequest,
			popularRecipesRequest
		]);

		this.setState({
			latestRecipes: latestRecipesResponse.data.data.result,
			popularRecipes: popularRecipesResponse.data.data.result,
			contentLoaded: true
		});
	}

	renderRecipes = (recipes) => {
		return (
      recipes.map((recipe) => {
        return <RecipeCard key={recipe._id}/>;
      })
    )
	};

	render() {
		return (
			<React.Fragment>
				{/* Hero Section */}
				<div className='section-hero adjust-margin-top'>
					<div className='hero-box'>
						<h1 className='hero-header'>CoffeeTalk</h1>
						<span className='hero-span'>
							Coffee-making made easier
						</span>
					</div>
					<FontAwesomeIcon icon={faChevronDown} />
				</div>

				{/* Latest 3 Recipes */}
				<div className='section-latest container'>
          <h2>What's New</h2>
					{this.state.contentLoaded ? (
						this.renderRecipes(this.state.latestRecipes)
					) : (
						<LoadingSpinner />
					)}
				</div>

				{/* Top 3 Recipes */}
				<div className='section-popular container'>
        <h2>What's Popular</h2>
        {this.state.contentLoaded ? (
						this.renderRecipes(this.state.popularRecipes)
					) : (
						<LoadingSpinner />
					)}
        </div>
			</React.Fragment>
		);
	}
}
