import { useEffect } from 'react'
import { TodoList } from '../components/todo/TodoList'
import { useTodosStore } from '../store/todos'
import { useKanbanStore } from '../store/kanban'

export function TodoPage() {
  const loadTodos = useTodosStore((s) => s.load)
  const loadKanban = useKanbanStore((s) => s.load)

  useEffect(() => {
    loadTodos()
    loadKanban() // necessário para promoção de to-do para card
  }, [loadTodos, loadKanban])

  return <TodoList />
}
