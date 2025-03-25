// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const fs = require('fs').promises; // For reading the JSON file
const OpenAI = require('openai'); // OpenAI API client

// Initialize OpenAI client with API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load the JSON configuration (assumes the file is named 'config.json')
async function loadConfig() {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

// Agent class to handle individual agent logic
class Agent {
  constructor({ id, data }) {
    this.id = id;
    this.name = data.name;
    this.systemPrompt = data.systemPrompt;
    this.description = data.description;
    this.model = data.model;
    this.isProcessing = data.isProcessing || false;
    this.lastResult = data.lastResult || null;
  }

  // Simulate agent processing by calling OpenAI API
  async processTask(input) {
    if (this.isProcessing) {
      console.log(`${this.name} is already processing. Skipping...`);
      return this.lastResult;
    }

    this.isProcessing = true;
    console.log(`${this.name} is processing...`);

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: input || 'Provide your output based on your role.' },
        ],
        max_tokens: 1000,
      });

      this.lastResult = response.choices[0].message.content;
      console.log(`${this.name} completed:`, this.lastResult.slice(0, 100) + '...');
      return this.lastResult;
    } catch (error) {
      console.error(`${this.name} encountered an error:`, error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

// Main function to run the multi-agent system
async function runMultiAgentSystem() {
  console.log('Starting Physics Mastery Multi-Agent System...');

  // Load configuration
  const config = await loadConfig();
  const agents = {};

  // Initialize agents from the 'nodes' array
  config.nodes.forEach((node) => {
    const agent = new Agent(node);
    agents[agent.id] = agent;
  });

  // Find the coordinator (assuming it's named 'PhysicsMasterCoordinator')
  const coordinator = Object.values(agents).find(
    (agent) => agent.name === 'PhysicsMasterCoordinator'
  );

  if (!coordinator) {
    throw new Error('PhysicsMasterCoordinator not found!');
  }

  // Simulate task distribution and execution
  const tasks = {
    'PhysicsTheoryExpert': 'Explain the theory of relativity in detail.',
    'PhysicsApplicationExpert': 'Provide practical applications of the theory of relativity.',
    'PhysicsTeachingAssistant': 'Create a simple explanation of the theory of relativity for beginners.',
  };

  // Run tasks concurrently for all agents except the coordinator
  const agentPromises = Object.values(agents)
    .filter((agent) => agent !== coordinator)
    .map((agent) => {
      const task = tasks[agent.name] || 'Perform your default role.';
      return agent.processTask(task);
    });

  // Wait for all agents to complete
  const results = await Promise.all(agentPromises);
  console.log('\nAll agents completed their tasks.');

  // Coordinator synthesizes results
  const synthesisInput = `
    Synthesize the following outputs into a comprehensive report:
    - Theory: ${agents['agent-1736316556173-pf4uixp06'].lastResult || 'N/A'}
    - Applications: ${agents['agent-1736316556173-ea3mglhji'].lastResult || 'N/A'}
    - Teaching Material: ${agents['agent-1736316556173-izicvndzu'].lastResult || 'N/A'}
  `;
  const finalReport = await coordinator.processTask(synthesisInput);

  console.log('\nFinal Report from PhysicsMasterCoordinator:');
  console.log(finalReport);

  // Save results back to config (optional)
  config.results = {
    ...config.results,
    [coordinator.id]: finalReport,
  };
  await fs.writeFile('config.json', JSON.stringify(config, null, 2));
  console.log('Results saved to config.json');
}

// Run the system and handle errors
runMultiAgentSystem()
  .catch((error) => {
    console.error('System failed:', error);
    process.exit(1);
  });
