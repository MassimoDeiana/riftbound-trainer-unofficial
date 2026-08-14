// Helper for effects-coverage.mjs: prints the registry coverage as JSON.
import { coverage } from '../src/effects/registry'

console.log(JSON.stringify(coverage()))
