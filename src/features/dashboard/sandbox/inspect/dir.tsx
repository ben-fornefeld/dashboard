import { cn } from '@/lib/utils'
import { DataTableRow } from '@/ui/data-table'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import SandboxInspectEmptyNode from './empty'
import { FilesystemNode } from './filesystem/types'
import { useDirectory } from './hooks/use-directory'
import SandboxInspectNode from './node'
import NodeLabel from './node-label'

interface SandboxInspectDirProps {
  dir: FilesystemNode & {
    type: 'dir'
  }
}

export default function SandboxInspectDir({ dir }: SandboxInspectDirProps) {
  const {
    hasError,
    error,
    isExpanded,
    toggle,
    isLoading,
    isLoaded,
    hasChildren,
    children,
  } = useDirectory(dir.path)

  return (
    <>
      <DataTableRow
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggle()
          }
        }}
        className={cn(
          'group hover:bg-bg-200 focus:ring-ring focus:bg-bg-200 h-7 min-h-7 cursor-pointer gap-1 truncate transition-none select-none even:bg-transparent focus:outline-none'
        )}
        data-slot="inspect-dir"
      >
        <motion.span
          initial={{
            rotate: isExpanded && isLoaded ? 90 : 0,
          }}
          animate={{
            rotate: isExpanded && isLoaded ? 90 : 0,
            color:
              isExpanded && isLoaded
                ? 'var(--color-fg)'
                : 'var(--color-fg-500)',
          }}
        >
          <ChevronRight className="ml-1 size-4" />
        </motion.span>
        <NodeLabel
          name={dir.name}
          isActive={isExpanded}
          isLoading={isLoading}
        />
        {hasError && (
          <span className="text-error flex items-center gap-1 truncate pt-0.5 pl-1 text-xs text-ellipsis">
            <AlertCircle className="size-3" />
            {error}
          </span>
        )}
      </DataTableRow>

      <AnimatePresence initial={false}>
        {isExpanded && isLoaded && (
          <motion.div
            key="dir-content"
            className="flex flex-col overflow-hidden pl-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.15,
              ease: 'circOut',
            }}
          >
            {hasChildren ? (
              children.map((child) => (
                <SandboxInspectNode key={child.path} path={child.path} />
              ))
            ) : (
              <SandboxInspectEmptyNode />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
