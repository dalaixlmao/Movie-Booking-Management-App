# Accessibility Guidelines for Movie Booking App

**Last Updated: August 7, 2025**

## Introduction

These guidelines outline the accessibility requirements for the Movie Booking App to ensure compliance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. Accessibility is not just a legal requirement but a core value of our service, enabling all users, regardless of abilities, to enjoy our movie booking platform.

## Scope

These guidelines apply to all user interfaces within the Movie Booking App, including:
- Movie browsing and search
- Cinema and showtime selection
- Seat selection interface
- Payment and checkout process
- User account management
- Booking history and e-tickets

## WCAG 2.1 Level AA Compliance Requirements

### 1. Perceivable

#### 1.1 Text Alternatives
- All non-text content (images, icons, buttons) must have text alternatives
- Movie posters must include descriptive alt text
- Seat maps must have text alternatives or accessible representations

**Implementation:**
```jsx
// Example of proper image implementation
<img 
  src="/movie-poster.jpg" 
  alt="Inception (2023): Science fiction thriller directed by Christopher Nolan" 
/>

// Seat selection component with proper accessibility
<Seat 
  row={row} 
  col={col} 
  status={seatStatus} 
  aria-label={`Row ${rowLabel}, Seat ${col}, ${seatStatus === 'available' ? 'available' : 'unavailable'}`}
  onClick={handleSeatSelection} 
/>
```

#### 1.2 Time-based Media
- Movie trailers must have captions
- Audio descriptions should be available for promotional content

#### 1.3 Adaptable Content
- Information must be presentable in different ways without losing structure
- Don't rely solely on visual characteristics (color, shape, size, location) to convey meaning
- Seat maps must be understandable when accessed via screen reader

**Implementation:**
```jsx
// Don't rely only on color to indicate seat status
// Bad example:
<div className={seatStatus === 'booked' ? 'bg-red' : 'bg-green'}></div>

// Good example:
<div 
  className={`seat ${seatStatus === 'booked' ? 'seat-booked' : 'seat-available'}`}
  aria-label={`Seat ${seatId}: ${seatStatus}`}
>
  {seatStatus === 'booked' && <span className="visually-hidden">Booked</span>}
</div>
```

#### 1.4 Distinguishable Content
- Text must have sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Text must be resizable up to 200% without loss of content or functionality
- Don't use images of text unless necessary (e.g., logos)
- Content must be visible in different viewport widths without horizontal scrolling

**Implementation:**
```css
/* Example of proper color contrast */
.primary-text {
  color: #333333; /* dark gray on white background */
  background-color: #ffffff;
}

.secondary-button {
  color: #ffffff; 
  background-color: #0057b8; /* Passes 4.5:1 contrast ratio */
}
```

### 2. Operable

#### 2.1 Keyboard Accessible
- All functionality must be operable through keyboard alone
- No keyboard traps
- Seat selection must be navigable via keyboard

**Implementation:**
```jsx
// Ensure interactive elements are keyboard accessible
<button 
  onClick={handlePayment} 
  onKeyDown={(e) => e.key === 'Enter' && handlePayment()}
  tabIndex={0}
>
  Complete Payment
</button>
```

#### 2.2 Enough Time
- Session timeout warnings must be provided with option to extend
- Payment processing must allow sufficient time for completion

**Implementation:**
```jsx
// Example session timeout warning
function SessionTimeoutWarning() {
  return (
    <div role="alertdialog" aria-labelledby="timeoutTitle" aria-describedby="timeoutDesc">
      <h2 id="timeoutTitle">Session Timeout</h2>
      <p id="timeoutDesc">Your session will expire in 2 minutes. Would you like to continue?</p>
      <button onClick={extendSession}>Yes, continue booking</button>
    </div>
  );
}
```

#### 2.3 Seizures and Physical Reactions
- No content that flashes more than 3 times per second

#### 2.4 Navigable
- Pages must have clear titles
- Purpose of each link must be clear from link text
- Multiple ways to find content (search, navigation)
- Clear headings and labels
- Keyboard focus must be visible

**Implementation:**
```jsx
// Clear heading structure
<h1>Movie Booking</h1>
<h2>Select Showtime</h2>
<h3>Available Times for Cinema XYZ</h3>

// Descriptive links
<a href="/movies/inception">
  View Inception showtimes
</a>
```

#### 2.5 Input Modalities
- Gestures must have alternatives
- Pointer cancellation must be possible
- Input fields must have appropriate labels

### 3. Understandable

#### 3.1 Readable
- Language of page must be programmatically determined
- Language of parts can be programmatically determined

**Implementation:**
```jsx
// Set document language
<html lang="en">
  {/* page content */}
</html>

// For foreign language content
<p>Director's note: <span lang="fr">C'est magnifique!</span></p>
```

#### 3.2 Predictable
- Navigation and interface components must be consistent
- No context changes on input alone
- Consistent identification for features

#### 3.3 Input Assistance
- Error identification
- Labels and instructions for user input
- Error prevention for legal and financial transactions
- Clear validation for form submissions

**Implementation:**
```jsx
// Form field with proper label and error handling
function EmailInput({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label htmlFor="email-input" id="email-label">Email Address</label>
      <input
        id="email-input"
        type="email"
        aria-describedby={error ? "email-error" : undefined}
        aria-invalid={error ? "true" : "false"}
        value={value}
        onChange={onChange}
      />
      {error && (
        <div id="email-error" className="error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
```

### 4. Robust

#### 4.1 Compatible
- Valid HTML with properly closed elements and unique IDs
- Name, role, and value available for all UI components
- Status messages can be programmatically determined

**Implementation:**
```jsx
// Status message implementation
function PaymentStatus({ status }) {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="payment-status"
    >
      {status === 'processing' && 'Processing your payment...'}
      {status === 'success' && 'Payment successful! Preparing your tickets...'}
      {status === 'error' && 'Payment failed. Please try again.'}
    </div>
  );
}
```

## Specific Implementation Guidelines for Key Features

### Movie Browsing

- Ensure all movie information is accessible to screen readers
- Provide text alternatives for movie posters and promotional images
- Ensure filter and sort controls are keyboard accessible

### Showtime Selection

- Make date selection calendar fully keyboard navigable
- Ensure sufficient color contrast for selected/unselected dates
- Time slots must be selectable via keyboard

### Seat Selection

1. **Keyboard Navigation**
   - Implement arrow key navigation through seat grid
   - Provide clear visual focus indicators for keyboard navigation
   - Allow selection/deselection with Space or Enter keys

2. **Screen Reader Support**
   - Announce seat information (row, number, availability, price)
   - Provide a text alternative for the seat map
   - Indicate selected seats programmatically

3. **Visual Distinctions**
   - Use both color AND symbols/text to indicate seat status
   - Maintain sufficient contrast between available/unavailable states
   - Provide zoom/magnification options for the seat map

4. **Implementation Example**:
```jsx
// Accessible seat component
<div 
  role="checkbox"
  aria-checked={isSelected}
  aria-label={`Row ${row}, Seat ${seatNumber}, ${status}, ${price}`}
  tabIndex={0}
  className={`seat seat-${status} ${isSelected ? 'selected' : ''}`}
  onClick={handleSelection}
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleSelection();
      e.preventDefault();
    }
  }}
>
  <span aria-hidden="true">{seatNumber}</span>
  <span className="visually-hidden">
    {isSelected ? 'Selected' : status === 'available' ? 'Available' : 'Unavailable'}
  </span>
</div>
```

### Payment Flow

1. **Form Accessibility**
   - All form fields must have associated labels
   - Error messages must be linked to their fields
   - Group related fields (e.g., credit card details)

2. **Validation**
   - Provide clear error messages
   - Allow sufficient time to complete forms
   - Confirm important actions before proceeding

3. **Implementation Example**:
```jsx
<div role="group" aria-labelledby="payment-details-heading">
  <h2 id="payment-details-heading">Payment Details</h2>
  
  <label htmlFor="card-number">Card Number</label>
  <input 
    id="card-number" 
    type="text" 
    autoComplete="cc-number"
    aria-required="true"
    aria-describedby="card-number-error"
  />
  {cardNumberError && (
    <div id="card-number-error" role="alert" className="error-message">
      {cardNumberError}
    </div>
  )}
  
  {/* Other payment fields */}
  
  <button 
    type="submit"
    aria-busy={isProcessing ? "true" : "false"}
  >
    {isProcessing ? 'Processing...' : 'Pay Now'}
  </button>
</div>
```

### Booking Confirmation

- Provide confirmation information in text format, not just visually
- Ensure all booking details are accessible to screen readers
- Provide multiple options for retrieving tickets

## Testing Requirements

### Automated Testing
- Integrate accessibility testing into CI/CD pipeline
- Use tools like Axe, Lighthouse, or WAVE for automated checks

### Manual Testing
- Keyboard-only navigation testing
- Screen reader testing with NVDA and VoiceOver
- Color contrast verification
- Testing with magnification and zoom

### User Testing
- Include users with disabilities in usability testing
- Test with various assistive technologies
- Document and address accessibility barriers identified

## Implementation Checklist

### Development Phase
- [ ] Use semantic HTML elements
- [ ] Implement proper ARIA attributes where needed
- [ ] Ensure keyboard accessibility for all interactions
- [ ] Test components with screen readers during development
- [ ] Maintain sufficient color contrast

### QA Phase
- [ ] Conduct automated accessibility testing
- [ ] Perform manual keyboard navigation testing
- [ ] Test with screen readers
- [ ] Verify color contrast compliance
- [ ] Test responsiveness and text resizing

### Pre-Launch
- [ ] Complete full WCAG 2.1 AA compliance review
- [ ] Address all critical accessibility issues
- [ ] Document known issues and remediation plan
- [ ] Consider conducting an external accessibility audit

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Compliance Statement**: These guidelines represent our commitment to achieving and maintaining WCAG 2.1 Level AA compliance. All developers, designers, and content creators must follow these guidelines for all new features and updates to existing features.