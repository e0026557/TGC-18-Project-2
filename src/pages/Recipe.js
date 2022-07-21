import React from 'react';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Table from 'react-bootstrap/Table';
import LoadingSpinner from './../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import validateEmail from './../utilities/validateEmail';

const BASE_API_URL = 'https://coffeetalk-api.herokuapp.com/';

export default class Recipe extends React.Component {
	// --- State ---
	state = {
		recipe: {},
		email: '',
		reviewChanged: false,
		contentLoaded: false,
		// Modal
		show: false,
		editStatus: false,
		deleteStatus: false,
		emailError: false, // set to true for testing purposes
		accessDeniedShow: false,
		// Review
		reviewTitle: '',
		reviewContent: '',
		reviewRating: '',
		reviewUsername: '',
		reviewEmail: '',
		reviewErrors: [],
		// Offcanvas (Coffee bean info)
		offcanvasShow: false,
		beanInfo: {}
	};

	// --- Functions ---
	async componentDidMount() {
		// Get Recipe Details
		let response = await axios.get(
			BASE_API_URL + 'recipes/' + this.props.activeRecipe
		);
		let recipe = response.data.data.result;

		// Update state
		this.setState({
			recipe: recipe,
			contentLoaded: true
		});
	}

	async componentDidUpdate() {
		if (this.state.reviewChanged) {
			// Get Recipe Details
			let response = await axios.get(
				BASE_API_URL + 'recipes/' + this.props.activeRecipe
			);
			let recipe = response.data.data.result;

			// Update state
			this.setState({
				recipe: recipe,
				contentLoaded: true,
				reviewChanged: false // Reset to default
			});
		}
	}

	handleShow = (option) => {
		if (option === 'edit') {
			this.setState({
				show: true,
				editStatus: true,
				deleteStatus: false
			});
		} else if (option === 'delete') {
			this.setState({
				show: true,
				editStatus: false,
				deleteStatus: true
			});
		}
	};

	handleClose = () => {
		this.setState({
			show: false,
			editStatus: false,
			deleteStatus: false
		});
	};

	processRequest = async () => {
		// Validate email
		if (!validateEmail(this.state.email)) {
			this.setState({
				emailError: true,
				accessDeniedShow: false
			});
			return;
		}

		// Check if user has access to recipe
		let response = await axios.post(
			BASE_API_URL + 'recipes/' + this.props.activeRecipe + '/access',
			{
				email: this.state.email
			}
		);
		let accessPermission = response.data.data.result;

		// Proceed to handle edit/delete request
		if (accessPermission) {
			if (this.state.deleteStatus) {
				try {
					await axios.delete(
						BASE_API_URL + 'recipes/' + this.props.activeRecipe
					);
					this.props.setActivePage('recipes');
				} catch (err) {
					console.log(err);
				}
			} else if (this.state.editStatus) {
				// Redirect user to Edit page
				this.props.setActivePage('edit');
			}
		} else {
			this.setState({
				accessDeniedShow: true,
				emailError: false
			});
		}
	};

	updateFormField = (event) => {
		// Check if input type is checkbox
		if (event.target.type !== 'checkbox') {
			this.setState({
				[event.target.name]: event.target.value
			});
		} else {
			// Uncheck checkbox if it is already checked
			if (this.state[event.target.name].includes(event.target.value)) {
				this.setState({
					[event.target.name]: this.state[event.target.name].filter(
						(element) => element !== event.target.value
					)
				});
			}
			// Check checkbox if it is not already checked
			else {
				this.setState({
					[event.target.name]: [
						...this.state[event.target.name],
						event.target.value
					]
				});
			}
		}
	};

	showBeanInfo = (bean) => {
		this.setState({
			beanInfo: bean,
			offcanvasShow: true
		});
	};

	hideBeanInfo = () => {
		this.setState({
			offcanvasShow: false
		});
	};

	validateReviewInputs = () => {
		let reviewErrors = [];

		// Check username
		if (this.state.reviewUsername.length < 5) {
			reviewErrors.push('reviewUsername');
		}

		// Check email
		if (!this.state.reviewEmail || !validateEmail(this.state.reviewEmail)) {
			reviewErrors.push('reviewEmail');
		}

		// Check title
		if (this.state.reviewTitle.length < 5) {
			reviewErrors.push('reviewTitle');
		}

		// Check content
		if (this.state.reviewContent.length < 5) {
			reviewErrors.push('reviewContent');
		}

		// Check rating
		if (!this.state.reviewRating) {
			reviewErrors.push('reviewRating');
		}

		return reviewErrors;
	};

	addReview = async () => {
		// Validate review form inputs
		const reviewErrors = this.validateReviewInputs();

		if (reviewErrors.length === 0) {
			// Process review
			let newReview = {
				title: this.state.reviewTitle,
				content: this.state.reviewContent,
				rating: this.state.reviewRating,
				username: this.state.reviewUsername,
				email: this.state.reviewEmail
			};

			await axios.post(
				BASE_API_URL +
					'recipes/' +
					this.props.activeRecipe +
					'/reviews',
				newReview
			);

			// Update state
			this.setState({
				reviewChanged: true,
				contentLoaded: false // Trigger loading animation
			});
		} else {
			this.setState({
				reviewErrors: reviewErrors
			});
		}
	};

	renderRecipeDetails = () => {
		return (
			<React.Fragment>
				{/* Image */}
				<div className='img-box mb-4'>
					<img
						src={this.state.recipe.image_url}
						alt='Photo of coffee'
					/>
				</div>

				{/* Recipe Name */}
				<h2 className='recipe-name mb-3'>
					{this.state.recipe.recipe_name}
				</h2>

				{/* Recipe Details */}
				<div>
					<ul>
						<li>
							<span className='recipe-field-header'>
								Average rating :
							</span>{' '}
							{this.state.recipe.average_rating}
						</li>
						<li>
							<span className='recipe-field-header'>
								Author :
							</span>{' '}
							{this.state.recipe.user.username}
						</li>
						<li>
							<span className='recipe-field-header'>
								Date posted :
							</span>{' '}
							{new Date(
								this.state.recipe.date.slice(0, 10)
							).toDateString()}
						</li>
						<li>
							<span className='recipe-field-header'>
								Description :
							</span>
							<p>{this.state.recipe.description}</p>
						</li>
						<li>
							<span className='recipe-field-header'>
								Total brew time :
							</span>{' '}
							{this.state.recipe.total_brew_time}
						</li>
						<li>
							<span className='recipe-field-header'>
								Brew yield :
							</span>{' '}
							{this.state.recipe.brew_yield}
						</li>
						<li>
							<span className='recipe-field-header'>
								Brewing method :
							</span>{' '}
							{this.state.recipe.brewing_method.name}
						</li>
						<li>
							<span className='recipe-field-header'>
								Coffee bean(s) :
							</span>
							<ul>
								{this.state.recipe.coffee_beans.map((bean) => {
									return (
										<li className='d-flex justify-content-start align-items-center gap-2 py-1'>
											<Button
												className='btn-bean-info'
												onClick={() => {
													this.showBeanInfo(bean);
												}}
											>
												<FontAwesomeIcon
													icon={faInfo}
												/>
											</Button>
											{bean.name}
										</li>
									);
								})}
							</ul>
						</li>
						<li>
							<span className='recipe-field-header'>
								Coffee rest period :
							</span>{' '}
							{this.state.recipe.coffee_rest_period}
						</li>
						<li>
							<span className='recipe-field-header'>
								Amount of coffee :
							</span>{' '}
							{this.state.recipe.amount_of_coffee}g
						</li>
						<li>
							<span className='recipe-field-header'>
								Grinder :
							</span>{' '}
							{this.state.recipe.grinder.brand}{' '}
							{this.state.recipe.grinder.model}
						</li>
						<li>
							<span className='recipe-field-header'>
								Grind setting :
							</span>{' '}
							{this.state.recipe.grind_setting}
						</li>
						<li>
							<span className='recipe-field-header'>
								Amount of water :
							</span>{' '}
							{this.state.recipe.amount_of_water}
						</li>
						<li>
							<span className='recipe-field-header'>
								Water temperature :
							</span>{' '}
							{this.state.recipe.water_temperature} &#8451;
						</li>
						<li>
							<span className='recipe-field-header'>
								Brewer :
							</span>{' '}
							{this.state.recipe.brewer.brand}{' '}
							{this.state.recipe.brewer.model}
						</li>
						<li>
							<span className='recipe-field-header'>
								Additional ingredients :
							</span>{' '}
							{this.state.recipe.additional_ingredients[0] ? (
								<ul>
									{this.state.recipe.additional_ingredients.map(
										(ingredient) => {
											return <li>{ingredient}</li>;
										}
									)}
								</ul>
							) : (
								'None'
							)}
						</li>
						<li>
							<span className='recipe-field-header'>
								Additional equipment :
							</span>{' '}
							{this.state.recipe.additional_equipment[0] ? (
								<ul>
									{this.state.recipe.additional_equipment.map(
										(equipment) => {
											return <li>{equipment}</li>;
										}
									)}
								</ul>
							) : (
								'None'
							)}
						</li>
					</ul>
				</div>

				{/* Recipe instructions */}
				<h6 className='recipe-field-header'>Instructions :</h6>
				<ul>
					{this.state.recipe.steps.map((step, index) => {
						return (
							<li key={index}>
								<span className='recipe-field-header'>
									Step {index + 1} :
								</span>{' '}
								{step}
							</li>
						);
					})}
				</ul>

				{/* Recipe buttons */}
				<div className='d-flex justify-content-center align-items-center gap-3 mt-3'>
					<Button
						className='btn-custom-primary'
						onClick={() => {
							this.handleShow('edit');
						}}
					>
						Edit
					</Button>

					<Button
						variant='danger'
						onClick={() => {
							this.handleShow('delete');
						}}
					>
						Delete
					</Button>
				</div>
			</React.Fragment>
		);
	};

	renderReviews = () => {
		return (
			<React.Fragment>
				<ul className='list-group'>
					{this.state.recipe.reviews.map((review) => {
						return (
							<li
								key={review._id}
								className='list-group-item my-2'
							>
								<p>
									Date:{' '}
									{new Date(
										review.date.slice(0, 10)
									).toDateString()}
								</p>
								<p>Title: {review.title}</p>
								<p>Content: {review.content}</p>
								<p>Rating: {review.rating}</p>
								<p>Username: {review.username}</p>
							</li>
						);
					})}
				</ul>
			</React.Fragment>
		);
	};

	renderAddReviewForm = () => {
		return (
			<React.Fragment>
				<div className='container'>
					<h4>Add review</h4>
					{/* Reviewer's username */}
					<Form.Group className='mt-3'>
						<Form.Label>
							Username <span className='text-danger'>*</span>
						</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter username'
							name='reviewUsername'
							value={this.state.reviewUsername}
							onChange={this.updateFormField}
						/>
						{this.state.reviewErrors.includes('reviewUsername') ? (
							<Form.Text className='errorMessage'>
								Username must be at least 5 characters long
							</Form.Text>
						) : (
							''
						)}
					</Form.Group>

					{/* Reviewer's email */}
					<Form.Group className=''>
						<Form.Label>
							Email <span className='text-danger'>*</span>
						</Form.Label>
						<Form.Control
							type='email'
							placeholder='Enter email'
							name='reviewEmail'
							value={this.state.reviewEmail}
							onChange={this.updateFormField}
						/>
						{this.state.reviewErrors.includes('reviewEmail') ? (
							<Form.Text className='errorMessage'>
								Invalid email address
							</Form.Text>
						) : (
							''
						)}
					</Form.Group>

					{/* Review title */}
					<Form.Group className=''>
						<Form.Label>
							Title <span className='text-danger'>*</span>
						</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter review title'
							name='reviewTitle'
							value={this.state.reviewTitle}
							onChange={this.updateFormField}
						/>
						{this.state.reviewErrors.includes('reviewTitle') ? (
							<Form.Text className='errorMessage'>
								Title must be at least 5 characters long
							</Form.Text>
						) : (
							''
						)}
					</Form.Group>

					{/* Review content */}
					<Form.Group className=''>
						<Form.Label>
							Content <span className='text-danger'>*</span>
						</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter review content'
							name='reviewContent'
							value={this.state.reviewContent}
							onChange={this.updateFormField}
						/>
						{this.state.reviewErrors.includes('reviewContent') ? (
							<Form.Text className='errorMessage'>
								Content must be at least 5 characters long
							</Form.Text>
						) : (
							''
						)}
					</Form.Group>

					{/* Review rating */}
					<Form.Group className='mb-3'>
						<Form.Label>
							Rating <span className='text-danger'>*</span>
						</Form.Label>
						<Form.Select
							name='reviewRating'
							value={this.state.reviewRating}
							onChange={this.updateFormField}
						>
							<option value='' disabled>
								--- Select rating ---
							</option>
							{[0, 1, 2, 3, 4, 5].map((rating) => {
								return (
									<option key={rating} value={rating}>
										{rating}
									</option>
								);
							})}
						</Form.Select>
						{this.state.reviewErrors.includes('reviewRating') ? (
							<Form.Text className='errorMessage'>
								Please select a rating
							</Form.Text>
						) : (
							''
						)}
					</Form.Group>

					{/* Submit review button */}
					<div className='d-flex justify-content-center align-items-center'>
						<Button
							className='btn-custom-primary my-3'
							onClick={this.addReview}
						>
							Add review
						</Button>
					</div>
				</div>
			</React.Fragment>
		);
	};

	render() {
		return (
			<React.Fragment>
				<section className='adjust-margin-top'>
					<div className='container d-flex flex-column justify-content-center pt-3'>
						{this.state.contentLoaded ? (
							<React.Fragment>
								<div className='container-fluid mb-5'>
									{this.renderRecipeDetails()}
								</div>
								<div className='container mt-3'>
									<h3>Reviews</h3>
									<div className='review-box px-4 py-4 my-3'>
										{this.renderReviews()}
									</div>
									<div className='review-form pt-4 pb-3 px-3 mb-5'>
										{this.renderAddReviewForm()}
									</div>
								</div>
							</React.Fragment>
						) : (
							<LoadingSpinner />
						)}
					</div>

					{/* Validation modal for edit/delete */}
					<Modal show={this.state.show} onHide={this.handleClose}>
						<Modal.Header closeButton>
							<Modal.Title>
								{this.state.editStatus
									? 'Edit Recipe'
									: 'Delete Recipe'}
							</Modal.Title>
						</Modal.Header>
						<Modal.Body>
							{this.state.accessDeniedShow ? (
								<Alert variant='danger'>
									Permission denied
								</Alert>
							) : (
								''
							)}
							<span>Enter email to proceed</span>
							<Form.Group className='mt-3'>
								<Form.Control
									name='email'
									type='email'
									placeholder='Enter email'
									value={this.state.email}
									onChange={this.updateFormField}
								/>
								{this.state.emailError ? (
									<Form.Text className='errorMessage'>
										Invalid email address
									</Form.Text>
								) : (
									''
								)}
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button
								variant='secondary'
								onClick={this.handleClose}
							>
								Close
							</Button>
							<Button
								variant={
									this.state.deleteStatus
										? 'danger'
										: 'primary'
								}
								onClick={this.processRequest}
							>
								{this.state.deleteStatus
									? 'Confirm delete'
									: 'Proceed'}
							</Button>
						</Modal.Footer>
					</Modal>

					{/* Offcanvas for coffee bean information */}
					<Offcanvas
						show={this.state.offcanvasShow}
						onHide={this.hideBeanInfo}
						placement='start'
					>
						<Offcanvas.Header closeButton>
							<Offcanvas.Title>
								{this.state.beanInfo.name}
							</Offcanvas.Title>
						</Offcanvas.Header>
						<Offcanvas.Body>
							<Table striped bordered>
								<thead>
									<tr>
										<th>Field</th>
										<th>Value</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Name</td>
										<td>{this.state.beanInfo.name}</td>
									</tr>
									<tr>
										<td>Roast level</td>
										<td>
											{this.state.beanInfo.roast_level}
										</td>
									</tr>
									<tr>
										<td>Blend</td>
										<td>
											{this.state.beanInfo.blend
												? 'Yes'
												: 'No'}
										</td>
									</tr>
									<tr>
										<td>Variety</td>
										<td>{this.state.beanInfo.variety}</td>
									</tr>
									<tr>
										<td>Flavor note</td>
										<td>
											{this.state.beanInfo.flavor_notes
												? this.state.beanInfo.flavor_notes.join(
														', '
												  )
												: ''}
										</td>
									</tr>
									<tr>
										<td>Roaster</td>
										<td>{this.state.beanInfo.roaster}</td>
									</tr>
									<tr>
										<td>Origin(s)</td>
										<td>
											{this.state.beanInfo.origins
												? this.state.beanInfo.origins.join(
														', '
												  )
												: ''}
										</td>
									</tr>
								</tbody>
							</Table>
						</Offcanvas.Body>
					</Offcanvas>
				</section>
			</React.Fragment>
		);
	}
}
