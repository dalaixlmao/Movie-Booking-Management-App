import Joi from 'joi';

/**
 * Schema for creating a new booking
 */
export const createBookingSchema = Joi.object({
  bookedSeats: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .description('Array of seat IDs to book'),
  
  startTime: Joi.number()
    .integer()
    .positive()
    .required()
    .description('Timestamp for the movie showing'),
  
  cinemaId: Joi.number()
    .integer()
    .positive()
    .required()
    .description('ID of the cinema')
});

/**
 * Schema for getting bookings for a user
 */
export const getUserBookingsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid('active', 'completed', 'cancelled', 'all').default('all')
});

/**
 * Schema for getting booking details
 */
export const getBookingDetailSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required()
});

/**
 * Schema for cancelling a booking
 */
export const cancelBookingSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required(),
  reason: Joi.string().max(500)
});

/**
 * Schema for cinema and slots details request
 */
export const getCinemaAndSlotsSchema = Joi.object({
  movieId: Joi.number().integer().positive().required(),
  currDate: Joi.string().isoDate().required()
});

/**
 * Schema for auditorium and seat information request
 */
export const getAuditoriumSeatsSchema = Joi.object({
  cinemaId: Joi.number().integer().positive().required(),
  timeStamp: Joi.number().integer().positive().required()
});