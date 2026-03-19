import type { SyllabusResponse } from '../types';

export const mockSyllabus: SyllabusResponse = {
  subject_name: "Introduction to Artificial Intelligence",
  semester: "Fall 2026",
  modules: [
    {
      module_number: "M1",
      title: "Foundations of Machine Learning",
      topics: [
        { title: "Supervised vs Unsupervised Learning", estimated_hours: "2h" },
        { title: "Linear Regression and Gradient Descent", estimated_hours: "3h" },
        { title: "Overfitting and Regularization", estimated_hours: "1.5h" }
      ]
    },
    {
      module_number: "M2",
      title: "Neural Networks and Deep Learning",
      topics: [
        { title: "Perceptrons and Activation Functions", estimated_hours: "2h" },
        { title: "Backpropagation Algorithm", estimated_hours: "4h" },
        { title: "Convolutional Neural Networks (CNNs)", estimated_hours: "3.5h" }
      ]
    },
    {
      module_number: "M3",
      title: "Natural Language Processing",
      topics: [
        { title: "Word Embeddings (Word2Vec, GloVe)", estimated_hours: "2.5h" },
        { title: "Recurrent Neural Networks (RNNs) and LSTMs", estimated_hours: "3h" },
        { title: "Transformers and Attention Mechanism", estimated_hours: "4h" },
        { title: "Large Language Models (LLMs)", estimated_hours: "2h" }
      ]
    }
  ]
};
