import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals: true` testing-library no desmonta solo: cada render quedaba vivo para el test siguiente.
afterEach(cleanup)
